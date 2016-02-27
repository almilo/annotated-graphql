import assert from 'assert';
import RegexpAnnotationExtractor from './regexp-annotation-extractor';

const regexpAnnotationExtractor = new RegexpAnnotationExtractor(
    '@(foo)\\s*\\(([\\S|\\s]*?)\\)\\s*type\\s+(.*?)\\s*\\{',
    annotations => (match, type, attributes, typeName) => {
        annotations.push(`${type}, ${attributes}, ${typeName}`);

        return `type ${typeName} {`;
    }
);

describe('RegexpAnnotationExtractor', function () {
    it('should not modify anything when the text does not match', function () {
        const annotations = [];

        const text = regexpAnnotationExtractor.extract(`foo bar`, annotations);

        text.should.be.equal('foo bar');
        annotations.should.be.empty();
    });

    it('should extract the annotation when the text matches', function () {
        const annotations = [];

        const text = regexpAnnotationExtractor.extract('@foo(bar: "baz") type Foo {}', annotations);

        text.should.equal('type Foo {}');
        annotations.should.be.deepEqual([
            'foo, bar: "baz", Foo'
        ]);
    });
});
