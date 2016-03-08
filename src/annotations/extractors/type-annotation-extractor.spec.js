import TypeAnnotationExtractor from './type-annotation-extractor';

class FooAnnotation {
    constructor(typeName) {
        this.typeName = typeName;
    }
}

const typeAnnotationExtractor = new TypeAnnotationExtractor('foo', FooAnnotation);

describe('TypeAnnotationExtractor', function () {
    it('should not modify anything when the text does not match', function () {
        const annotations = [];

        const text = typeAnnotationExtractor.extract(`foo bar`, annotations);

        text.should.be.equal('foo bar');
        annotations.should.be.empty();
    });

    it('should extract the annotation when it applies to a type', function () {
        const annotations = [];

        const text = typeAnnotationExtractor.extract('@foo(bar: "baz") type Foo { foo() }', annotations);

        text.should.equal('type Foo { foo() }');
        annotations.should.be.deepEqual([{
            typeName: 'Foo',
            'bar': 'baz'
        }]);
        annotations[0].should.be.instanceOf(FooAnnotation);
    });

    it('should not extract the annotation when it does not apply to a type', function () {
        const annotations = [];

        const text = typeAnnotationExtractor.extract('type Foo {@foo(bar: "baz") foo() }', annotations);

        text.should.equal('type Foo {@foo(bar: "baz") foo() }');
        annotations.should.be.deepEqual([]);
    });


    it('should extract first type annotation', function () {
        const annotations = [];

        const text = typeAnnotationExtractor.extract('@foo(bar: "bar") @bar(baz: "baz") type Foo { foo() }', annotations);

        text.should.equal('type Foo { foo() }');
        annotations.should.be.deepEqual([{
            typeName: 'Foo',
            'bar': 'bar'
        }]);
        annotations[0].should.be.instanceOf(FooAnnotation);
    });
});
