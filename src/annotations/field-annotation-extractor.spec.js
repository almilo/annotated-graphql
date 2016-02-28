import FieldAnnotationExtractor from './field-annotation-extractor';

class FooAnnotation {
    constructor(typeName, fieldName) {
        this.typeName = typeName;
        this.fieldName = fieldName;
    }
}

const fieldAnnotationExtractor = new FieldAnnotationExtractor('foo', FooAnnotation);

describe('FieldAnnotationExtractor', function () {
    it('should not modify anything when the text does not match', function () {
        const annotations = [];

        const text = fieldAnnotationExtractor.extract(`foo bar`, annotations);

        text.should.be.equal('foo bar');
        annotations.should.be.empty();
    });

    it('should extract the annotation when it applies to a field', function () {
        const annotations = [];

        const text = fieldAnnotationExtractor.extract('type Foo { @foo(bar: "baz") foo() }', annotations);

        text.should.equal('type Foo {  foo() }');
        annotations.should.be.deepEqual([{
            typeName: 'Foo',
            fieldName: 'foo',
            'bar': 'baz'
        }]);
        annotations[0].should.be.instanceOf(FooAnnotation);
    });

    it('should not extract the annotation when it does not apply to a field', function () {
        const annotations = [];

        const text = fieldAnnotationExtractor.extract('@foo(bar: "baz") type Foo {}', annotations);

        text.should.equal('@foo(bar: "baz") type Foo {}');
        annotations.should.be.deepEqual([]);
    });

    it('should extract the annotation which applies to the field', function () {
        const annotations = [];

        const text = fieldAnnotationExtractor.extract('type Bar { bar() } @foo(bar: "baz") type Foo { @foo(bar: "baz") foo() }', annotations);

        text.should.equal('type Bar { bar() } @foo(bar: "baz") type Foo {  foo() }');
        annotations.should.be.deepEqual([{
            typeName: 'Foo',
            fieldName: 'foo',
            'bar': 'baz'
        }]);
        annotations[0].should.be.instanceOf(FooAnnotation);
    });

    it('should extract first field annotation', function () {
        const annotations = [];

        const text = fieldAnnotationExtractor.extract('type Bar { bar() } type Foo { @foo(bar: "bar") @bar(baz: "baz") foo() }', annotations);

        text.should.equal('type Bar { bar() } type Foo {  @bar(baz: "baz") foo() }');
        annotations.should.be.deepEqual([
            {
                typeName: 'Foo',
                fieldName: 'foo',
                'bar': 'bar'
            }]);
        annotations[0].should.be.instanceOf(FooAnnotation);
    });
});
